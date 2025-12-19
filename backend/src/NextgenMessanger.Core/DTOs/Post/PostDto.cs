namespace NextgenMessanger.Core.DTOs.Post;

public class PostDto
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public string? AuthorUsername { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public string? Content { get; set; }
    public List<string> MediaUrl { get; set; } = new();
    public string Visibility { get; set; } = string.Empty;
    public int ReactionsCount { get; set; }
    public int CommentsCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

