namespace NextgenMessanger.Core.Entities;

public class Profile : BaseEntity
{
    public Guid UserId { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public DateTime? DateOfBirth { get; set; }

    public User User { get; set; } = null!;
}

