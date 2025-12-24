using NextgenMessanger.Core.Enums;
using PostEntity = NextgenMessanger.Core.Entities.Post;

namespace NextgenMessanger.Core.DTOs.Post;

public class PostDto
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public string? AuthorUsername { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public string? Content { get; set; }
    public List<string> MediaUrl { get; set; } = new();
    public PostVisibility Visibility { get; set; }
    public int ReactionsCount { get; set; }
    public int CommentsCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static PostDto MapFromEntity(
        PostEntity post,
        int reactionsCount,
        int commentsCount,
        bool isLikedByCurrentUser)
    {
        return new PostDto
        {
            Id = post.Id,
            AuthorId = post.AuthorId,
            AuthorUsername = post.Author.Username,
            AuthorAvatarUrl = post.Author.Profile?.AvatarUrl,
            Content = post.Content,
            MediaUrl = post.MediaUrl,
            Visibility = post.Visibility,
            ReactionsCount = reactionsCount,
            CommentsCount = commentsCount,
            IsLikedByCurrentUser = isLikedByCurrentUser,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
        };
    }
}

