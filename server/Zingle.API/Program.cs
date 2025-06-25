using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using System.Text;
using Zingle.API.Data;
using Zingle.API.Hubs;
using Zingle.API.Middlewares;
using Zingle.API.Models;
using Zingle.API.Services;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .WriteTo.Console()
    .WriteTo.File(
        Path.Combine("Logs", "zingle-api-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
builder.Host.UseSerilog();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add services to the container.
builder.Services.AddControllers();

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Add Identity with default token providers
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;

    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Add authentication with JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            builder.Configuration["JwtSettings:TokenKey"] ?? throw new InvalidOperationException("JWT Token Key not found in configuration"))),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    // Configure for SignalR authentication and CORS support
    options.Events = new JwtBearerEvents
    {
        // Handle JWT token in query for SignalR
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/hubs/chat") || path.StartsWithSegments("/hubs/call")))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        },
        
        // Handle authentication failures
        OnAuthenticationFailed = context =>
        {
            Log.Warning("Authentication failed: {Error}", context.Exception.Message);
            return Task.CompletedTask;
        },
        
        // Ensure CORS headers are preserved with 401 responses
        OnChallenge = context =>
        {
            // CORS headers are applied after OnChallenge
            // Ensure we don't modify the response if it's already started
            if (!context.Response.HasStarted)
            {
                context.Response.Headers["Access-Control-Allow-Origin"] = 
                    builder.Configuration["ClientUrl"] ?? "http://localhost:5173";
                context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
            }
            
            return Task.CompletedTask;
        }
    };
});

// Add authorization
builder.Services.AddAuthorization();

// Add SignalR
builder.Services.AddSignalR();

// Add services
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<DatabaseInitializer>();

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Zingle API", Version = "v1" });

    // Add JWT Authentication
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "JWT Authentication",
        Description = "Enter JWT Bearer token **_only_**",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    c.AddSecurityDefinition(securityScheme.Reference.Id, securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, new string[] { } }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// IMPORTANT: CORS middleware must be the absolute first middleware in the pipeline
// This ensures CORS headers are sent even if other middleware short-circuits the pipeline
app.UseCors();

// Enhanced logging for CORS requests
app.Use(async (context, next) => {
    if (context.Request.Method == "OPTIONS")
    {
        Log.Information("CORS Preflight request: Path={Path}, Origin={Origin}",
            context.Request.Path,
            context.Request.Headers["Origin"]);
    }
    
    context.Response.OnStarting(() => {
        if (!context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
        {
            Log.Warning("CORS headers missing in response for {Method} {Path}", 
                context.Request.Method, context.Request.Path);
        }
        return Task.CompletedTask;
    });
    
    await next.Invoke();
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Add error handling middleware after CORS
app.UseMiddleware<Zingle.API.Middlewares.ErrorHandlingMiddleware>();

// HTTPS redirection should come after CORS and error handling
app.UseHttpsRedirection();

// Setup static file serving for uploads folder
app.UseStaticFiles();

// Create uploads directory if it doesn't exist
var uploadsImagePath = Path.Combine(app.Environment.ContentRootPath, "Uploads", "Images");
if (!Directory.Exists(uploadsImagePath))
{
    Directory.CreateDirectory(uploadsImagePath);
}

var uploadsFilePath = Path.Combine(app.Environment.ContentRootPath, "Uploads", "Files");
if (!Directory.Exists(uploadsFilePath))
{
    Directory.CreateDirectory(uploadsFilePath);
}

app.UseRouting();

// Use CORS policy
app.UseCors("AllowClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR hubs
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<CallHub>("/hubs/call");

// Create and initialize database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbInitializer = services.GetRequiredService<DatabaseInitializer>();
        await dbInitializer.InitializeAsync();

        Log.Information("Database initialized successfully");
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "An error occurred while initializing the database");
    }
}

app.Run();

// Ensure proper application shutdown
app.Lifetime.ApplicationStopped.Register(Log.CloseAndFlush);
