using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.DTOs.Follow;

public class FollowDto
{
    public Guid Id { get; set; }
    public Guid FollowerId { get; set; }
    public string FollowerUsername { get; set; } = string.Empty;
    public string? FollowerAvatarUrl { get; set; }
    public Guid FolloweeId { get; set; }
    public string FolloweeUsername { get; set; } = string.Empty;
    public string? FolloweeAvatarUrl { get; set; }
    public FollowStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

