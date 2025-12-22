using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Comment;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class CommentService : ICommentService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public CommentService(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<CommentDto> CreateCommentAsync(Guid postId, Guid userId, CreateCommentDto createDto)
    {
        var post = await _context.Posts
            .FirstOrDefaultAsync(p => p.Id == postId && !p.Deleted);

        if (post == null)
        {
            throw new KeyNotFoundException("Post not found");
        }

        var comment = new Core.Entities.Comment
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            AuthorId = userId,
            Content = createDto.Content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Deleted = false
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Создать уведомление для автора поста (если это не его собственный комментарий к своему посту)
        if (post.AuthorId != userId)
        {
            await _notificationService.CreateNotificationAsync(
                post.AuthorId,
                "new_comment",
                new { post_id = postId.ToString(), comment_id = comment.Id.ToString(), user_id = userId.ToString() });
        }

        var commentWithAuthor = await _context.Comments
            .Include(c => c.Author)
                .ThenInclude(u => u.Profile)
            .FirstAsync(c => c.Id == comment.Id);

        return new CommentDto
        {
            Id = commentWithAuthor.Id,
            PostId = commentWithAuthor.PostId,
            AuthorId = commentWithAuthor.AuthorId,
            AuthorUsername = commentWithAuthor.Author.Username,
            AuthorAvatarUrl = commentWithAuthor.Author.Profile?.AvatarUrl,
            Content = commentWithAuthor.Content,
            CreatedAt = commentWithAuthor.CreatedAt,
            UpdatedAt = commentWithAuthor.UpdatedAt
        };
    }

    public async Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid postId, int page = 1, int pageSize = 20)
    {
        var comments = await _context.Comments
            .Include(c => c.Author)
                .ThenInclude(u => u.Profile)
            .Where(c => c.PostId == postId && !c.Deleted)
            .OrderBy(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return comments.Select(c => new CommentDto
        {
            Id = c.Id,
            PostId = c.PostId,
            AuthorId = c.AuthorId,
            AuthorUsername = c.Author.Username,
            AuthorAvatarUrl = c.Author.Profile?.AvatarUrl,
            Content = c.Content,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        });
    }

    public async Task DeleteCommentAsync(Guid commentId, Guid userId)
    {
        var comment = await _context.Comments
            .FirstOrDefaultAsync(c => c.Id == commentId && !c.Deleted);

        if (comment == null)
        {
            throw new KeyNotFoundException("Comment not found");
        }

        if (comment.AuthorId != userId)
        {
            throw new UnauthorizedAccessException("You can only delete your own comments");
        }

        comment.Deleted = true;
        comment.DeletedAt = DateTime.UtcNow;
        comment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}

