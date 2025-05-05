using System;
using System.Collections.Generic;

namespace Zingle.API.Models.Domain;

public partial class Message
{
    public int Id { get; set; }

    public int ConversationId { get; set; }

    public int SenderId { get; set; }

    public string? Content { get; set; }

    public string? MessageType { get; set; }

    public int? MediaId { get; set; }

    public DateTime? SentAt { get; set; }

    public bool? IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    public virtual Conversation Conversation { get; set; } = null!;

    public virtual Medium? Media { get; set; }

    public virtual User Sender { get; set; } = null!;
}
