using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.Entities;

public class Reaction : BaseEntity
{
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public ReactionType Type { get; set; } = ReactionType.Like;

    public Post Post { get; set; } = null!;
    public User User { get; set; } = null!;
}

