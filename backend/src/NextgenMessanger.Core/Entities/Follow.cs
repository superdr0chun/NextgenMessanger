using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.Entities;

public class Follow : BaseEntity
{
    public Guid FollowerId { get; set; }
    public Guid FolloweeId { get; set; }
    public FollowStatus Status { get; set; } = FollowStatus.Accepted;

    public User Follower { get; set; } = null!;
    public User Followee { get; set; } = null!;
}

