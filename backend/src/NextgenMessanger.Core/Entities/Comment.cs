namespace NextgenMessanger.Core.Entities;

public class Comment : BaseEntity
{
    public Guid PostId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;

    public Post Post { get; set; } = null!;
    public User Author { get; set; } = null!;
}

