namespace NextgenMessanger.Core.Entities;

public class Post : BaseEntity
{
    public Guid AuthorId { get; set; }
    public string? Content { get; set; }
    public List<string> MediaUrl { get; set; } = new();
    public string Visibility { get; set; } = "public";

    public User Author { get; set; } = null!;
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
}

