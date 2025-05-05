using System;
using System.Collections.Generic;

namespace Zingle.API.Models.Domain;

public partial class User
{
    public int Id { get; set; }

    public string UserName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? DisplayName { get; set; }

    public string? AvatarUrl { get; set; }

    public bool? IsOnline { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? LastActiveAt { get; set; }

    public bool? IsDeleted { get; set; }

    public virtual ICollection<CallLog> CallLogCallees { get; set; } = new List<CallLog>();

    public virtual ICollection<CallLog> CallLogCallers { get; set; } = new List<CallLog>();

    public virtual ICollection<ConversationMember> ConversationMembers { get; set; } = new List<ConversationMember>();

    public virtual ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();

    public virtual ICollection<Friend> FriendFriendNavigations { get; set; } = new List<Friend>();

    public virtual ICollection<FriendRequest> FriendRequestReceivers { get; set; } = new List<FriendRequest>();

    public virtual ICollection<FriendRequest> FriendRequestSenders { get; set; } = new List<FriendRequest>();

    public virtual ICollection<Friend> FriendUsers { get; set; } = new List<Friend>();

    public virtual ICollection<Medium> Media { get; set; } = new List<Medium>();

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
}
