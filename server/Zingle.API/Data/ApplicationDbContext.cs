using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Zingle.API.Models;

namespace Zingle.API.Data;

public class ApplicationDbContext : IdentityDbContext<AppUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Chat> Chats { get; set; } = null!;
    public DbSet<ChatParticipant> ChatParticipants { get; set; } = null!;
    public DbSet<Message> Messages { get; set; } = null!;
    public DbSet<FriendRequest> FriendRequests { get; set; } = null!;
    public DbSet<Friendship> Friendships { get; set; } = null!;
    public DbSet<CallLog> CallLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ChatParticipant relationships
        builder.Entity<ChatParticipant>()
            .HasOne(cp => cp.Chat)
            .WithMany(c => c.Participants)
            .HasForeignKey(cp => cp.ChatId);

        builder.Entity<ChatParticipant>()
            .HasOne(cp => cp.User)
            .WithMany(u => u.ChatParticipants)
            .HasForeignKey(cp => cp.UserId);

        // Message relationships
        builder.Entity<Message>()
            .HasOne(m => m.Chat)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ChatId);

        builder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.SentMessages)
            .HasForeignKey(m => m.SenderId);

        // Friend request relationships
        builder.Entity<FriendRequest>()
            .HasOne(fr => fr.FromUser)
            .WithMany(u => u.SentFriendRequests)
            .HasForeignKey(fr => fr.FromUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FriendRequest>()
            .HasOne(fr => fr.ToUser)
            .WithMany(u => u.ReceivedFriendRequests)
            .HasForeignKey(fr => fr.ToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Friendship relationships
        builder.Entity<Friendship>()
            .HasOne(f => f.User1)
            .WithMany(u => u.Friendships1)
            .HasForeignKey(f => f.User1Id)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Friendship>()
            .HasOne(f => f.User2)
            .WithMany(u => u.Friendships2)
            .HasForeignKey(f => f.User2Id)
            .OnDelete(DeleteBehavior.Restrict);

        // Call log relationships
        builder.Entity<CallLog>()
            .HasOne(cl => cl.Caller)
            .WithMany(u => u.InitiatedCalls)
            .HasForeignKey(cl => cl.CallerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<CallLog>()
            .HasOne(cl => cl.Recipient)
            .WithMany(u => u.ReceivedCalls)
            .HasForeignKey(cl => cl.RecipientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
