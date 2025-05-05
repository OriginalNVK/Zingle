using System;
using System.Collections.Generic;

namespace Zingle.API.Models.Domain;

public partial class Conversation
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public bool? IsGroup { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<CallLog> CallLogs { get; set; } = new List<CallLog>();

    public virtual ICollection<ConversationMember> ConversationMembers { get; set; } = new List<ConversationMember>();

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
}
