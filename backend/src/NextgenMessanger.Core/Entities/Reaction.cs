namespace NextgenMessanger.Core.Entities;

public class Reaction : BaseEntity
{
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = "like";

    public Post Post { get; set; } = null!;
    public User User { get; set; } = null!;
}

