using System;
using System.Collections.Generic;

namespace Zingle.API.Models.Domain;

public partial class Medium
{
    public int Id { get; set; }

    public string Url { get; set; } = null!;

    public string? FileType { get; set; }

    public int UploadedBy { get; set; }

    public DateTime? UploadedAt { get; set; }

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual User UploadedByNavigation { get; set; } = null!;
}
