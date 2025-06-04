using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Zingle.API.Data;
using Zingle.API.Models;

namespace Zingle.API.Services;

public class DatabaseInitializer
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(
        ApplicationDbContext context,
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ILogger<DatabaseInitializer> logger)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
    }

    public async Task InitializeAsync()
    {
        try
        {
            if (_context.Database.IsSqlServer())
            {
                _logger.LogInformation("Migrating database...");
                await _context.Database.MigrateAsync();
            }

            await SeedRolesAsync();
            await SeedUsersAsync();
            await SeedChatsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initializing the database");
            throw;
        }
    }

    private async Task SeedRolesAsync()
    {
        if (!await _roleManager.RoleExistsAsync("Admin"))
        {
            await _roleManager.CreateAsync(new IdentityRole("Admin"));
            _logger.LogInformation("Added Admin role");
        }

        if (!await _roleManager.RoleExistsAsync("User"))
        {
            await _roleManager.CreateAsync(new IdentityRole("User"));
            _logger.LogInformation("Added User role");
        }
    }

    private async Task SeedUsersAsync()
    {
        // Create admin user if it doesn't exist
        if (await _userManager.FindByEmailAsync("admin@example.com") == null)
        {
            var adminUser = new AppUser
            {
                UserName = "CharlieRoot",
                Email = "admin@example.com",
                DisplayName = "Charlie Root",
                AvatarUrl = "https://placehold.co/100x100/1e40af/FFFFFF?text=CR",
                IsOnline = true,
                LastActive = DateTime.UtcNow,
                Bio = "Overseeing operations."
            };

            var result = await _userManager.CreateAsync(adminUser, "Admin123!");
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(adminUser, "Admin");
                _logger.LogInformation("Added admin user: {UserName}", adminUser.UserName);
            }
            else
            {
                _logger.LogWarning("Failed to create admin user: {Errors}",
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        // Create sample users if they don't exist
        var sampleUsers = new[]
        {
            new {
                UserName = "SarahMiller",
                Email = "sarah@example.com",
                DisplayName = "Sarah Miller",
                AvatarUrl = "https://placehold.co/100x100/FF6347/FFFFFF?text=SM",
                Bio = "Can we fix it? Yes, we can!"
            },
            new {
                UserName = "MikeBrown",
                Email = "mike@example.com",
                DisplayName = "Mike Brown",
                AvatarUrl = "https://placehold.co/100x100/4682B4/FFFFFF?text=MB",
                Bio = "System Administrator."
            },
            new {
                UserName = "JessicaLee",
                Email = "jessica@example.com",
                DisplayName = "Jessica Lee",
                AvatarUrl = "https://placehold.co/100x100/32CD32/FFFFFF?text=JL",
                Bio = "Fighting for those who cannot fight for themselves."
            },
            new {
                UserName = "RobertJohnson",
                Email = "robert@example.com",
                DisplayName = "Robert Johnson",
                AvatarUrl = "https://placehold.co/100x100/9932CC/FFFFFF?text=RJ",
                Bio = "Software Developer with a passion for UI/UX design."
            },
            new {
                UserName = "EmmaWilson",
                Email = "emma@example.com",
                DisplayName = "Emma Wilson",
                AvatarUrl = "https://placehold.co/100x100/FF69B4/FFFFFF?text=EW",
                Bio = "Product Manager and coffee enthusiast."
            }
        };

        foreach (var sampleUser in sampleUsers)
        {
            if (await _userManager.FindByEmailAsync(sampleUser.Email) == null)
            {
                var user = new AppUser
                {
                    UserName = sampleUser.UserName,
                    Email = sampleUser.Email,
                    DisplayName = sampleUser.DisplayName,
                    AvatarUrl = sampleUser.AvatarUrl,
                    IsOnline = true,
                    LastActive = DateTime.UtcNow,
                    Bio = sampleUser.Bio
                };

                var result = await _userManager.CreateAsync(user, "User123!");
                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(user, "User");
                    _logger.LogInformation("Added user: {UserName}", user.UserName);
                }
                else
                {
                    _logger.LogWarning("Failed to create user {UserName}: {Errors}",
                        sampleUser.UserName,
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }
    }

    private async Task SeedChatsAsync()
    {
        // Check if we already have chats
        if (await _context.Chats.AnyAsync())
        {
            return;
        }

        // Get all users
        var users = await _userManager.Users.ToListAsync();
        if (users.Count < 2)
        {
            return;
        }

        // Create friendships between users
        var sarah = users.FirstOrDefault(u => u.UserName == "SarahMiller");
        var mike = users.FirstOrDefault(u => u.UserName == "MikeBrown");
        var jessica = users.FirstOrDefault(u => u.UserName == "JessicaLee");
        var robert = users.FirstOrDefault(u => u.UserName == "RobertJohnson");
        var emma = users.FirstOrDefault(u => u.UserName == "EmmaWilson");

        if (sarah != null && mike != null)
        {
            // Create a friendship
            var friendship1 = new Friendship
            {
                Id = Guid.NewGuid().ToString(),
                User1Id = sarah.Id,
                User2Id = mike.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            };
            _context.Friendships.Add(friendship1);

            // Create a chat between them
            var chat1 = new Chat
            {
                Id = Guid.NewGuid().ToString(),
                Name = $"{sarah.DisplayName}, {mike.DisplayName}",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                LastActivity = DateTime.UtcNow.AddHours(-2)
            };
            _context.Chats.Add(chat1);

            // Add participants
            _context.ChatParticipants.Add(new ChatParticipant
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = chat1.Id,
                UserId = sarah.Id,
                JoinedAt = DateTime.UtcNow.AddDays(-10),
                IsAdmin = false
            });

            _context.ChatParticipants.Add(new ChatParticipant
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = chat1.Id,
                UserId = mike.Id,
                JoinedAt = DateTime.UtcNow.AddDays(-10),
                IsAdmin = false
            });

            // Add some messages
            _context.Messages.Add(new Message
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = chat1.Id,
                SenderId = sarah.Id,
                Content = "Hey Mike, how's it going?",
                Timestamp = DateTime.UtcNow.AddDays(-5).AddHours(-3),
                Type = MessageType.Text
            });

            _context.Messages.Add(new Message
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = chat1.Id,
                SenderId = mike.Id,
                Content = "Hey Sarah! I'm doing well, just working on the new project.",
                Timestamp = DateTime.UtcNow.AddDays(-5).AddHours(-2),
                Type = MessageType.Text
            });

            _context.Messages.Add(new Message
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = chat1.Id,
                SenderId = sarah.Id,
                Content = "That sounds great! Let me know if you need any help.",
                Timestamp = DateTime.UtcNow.AddDays(-5).AddHours(-1),
                Type = MessageType.Text
            });
        }

        if (jessica != null && robert != null && emma != null)
        {
            // Create friendships
            var friendship2 = new Friendship
            {
                Id = Guid.NewGuid().ToString(),
                User1Id = jessica.Id,
                User2Id = robert.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            };
            _context.Friendships.Add(friendship2);

            var friendship3 = new Friendship
            {
                Id = Guid.NewGuid().ToString(),
                User1Id = jessica.Id,
                User2Id = emma.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-12)
            };
            _context.Friendships.Add(friendship3);

            var friendship4 = new Friendship
            {
                Id = Guid.NewGuid().ToString(),
                User1Id = robert.Id,
                User2Id = emma.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-8)
            };
            _context.Friendships.Add(friendship4);

            // Create a group chat
            var groupChat = new Chat
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Project Team",
                IsGroupChat = true,
                AvatarUrl = "https://placehold.co/100x100/6D28D9/FFFFFF?text=PT",
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                LastActivity = DateTime.UtcNow.AddHours(-1)
            };
            _context.Chats.Add(groupChat);

            // Add participants
            _context.ChatParticipants.Add(new ChatParticipant
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = groupChat.Id,
                UserId = jessica.Id,
                JoinedAt = DateTime.UtcNow.AddDays(-7),
                IsAdmin = true
            });

            _context.ChatParticipants.Add(new ChatParticipant
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = groupChat.Id,
                UserId = robert.Id,
                JoinedAt = DateTime.UtcNow.AddDays(-7),
                IsAdmin = false
            });

            _context.ChatParticipants.Add(new ChatParticipant
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = groupChat.Id,
                UserId = emma.Id,
                JoinedAt = DateTime.UtcNow.AddDays(-6),
                IsAdmin = false
            });

            // Add some messages
            _context.Messages.Add(new Message
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = groupChat.Id,
                SenderId = jessica.Id,
                Content = "Welcome to the Project Team chat!",
                Timestamp = DateTime.UtcNow.AddDays(-7),
                Type = MessageType.Text
            });

            _context.Messages.Add(new Message
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = groupChat.Id,
                SenderId = robert.Id,
                Content = "Thanks for setting this up, Jessica!",
                Timestamp = DateTime.UtcNow.AddDays(-7).AddMinutes(5),
                Type = MessageType.Text
            });

            _context.Messages.Add(new Message
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = groupChat.Id,
                SenderId = emma.Id,
                Content = "Hi everyone! Looking forward to working with you all.",
                Timestamp = DateTime.UtcNow.AddDays(-6).AddHours(1),
                Type = MessageType.Text
            });

            _context.Messages.Add(new Message
            {
                Id = Guid.NewGuid().ToString(),
                ChatId = groupChat.Id,
                SenderId = jessica.Id,
                Content = "Let's schedule our kickoff meeting for tomorrow at 10 AM.",
                Timestamp = DateTime.UtcNow.AddDays(-5).AddHours(3),
                Type = MessageType.Text
            });
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Sample chats and messages seeded");
    }
}
