namespace NextgenMessanger.Core.DTOs.Profile;

public class UpdateProfileDto
{
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public DateTime? DateOfBirth { get; set; }
}

