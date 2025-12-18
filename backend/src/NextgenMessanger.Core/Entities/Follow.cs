namespace NextgenMessanger.Core.Entities;

public class Follow : BaseEntity
{
    public Guid FollowerId { get; set; }
    public Guid FolloweeId { get; set; }
    public string Status { get; set; } = "accepted";

    public User Follower { get; set; } = null!;
    public User Followee { get; set; } = null!;
}

