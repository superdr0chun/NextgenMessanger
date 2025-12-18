namespace NextgenMessanger.Core.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Data { get; set; }
    public bool IsRead { get; set; }

    public User User { get; set; } = null!;
}

