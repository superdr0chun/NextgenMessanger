using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Core.Entities;

public class Post : BaseEntity
{
    public Guid AuthorId { get; set; }
    public string? Content { get; set; }
    public List<string> MediaUrl { get; set; } = new();
    public PostVisibility Visibility { get; set; } = PostVisibility.Public;

    public User Author { get; set; } = null!;
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
}

