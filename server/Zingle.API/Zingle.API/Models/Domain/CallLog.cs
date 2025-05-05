using System;
using System.Collections.Generic;

namespace Zingle.API.Models.Domain;

public partial class CallLog
{
    public int Id { get; set; }

    public int ConversationId { get; set; }

    public int CallerId { get; set; }

    public int CalleeId { get; set; }

    public string CallType { get; set; } = null!;

    public DateTime StartedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public string Status { get; set; } = null!;

    public virtual User Callee { get; set; } = null!;

    public virtual User Caller { get; set; } = null!;

    public virtual Conversation Conversation { get; set; } = null!;
}
