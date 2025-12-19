using NextgenMessanger.Core.DTOs.Comment;

namespace NextgenMessanger.Application.Interfaces;

public interface ICommentService
{
    Task<CommentDto> CreateCommentAsync(Guid postId, Guid userId, CreateCommentDto createDto);
    Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid postId, int page = 1, int pageSize = 20);
    Task DeleteCommentAsync(Guid commentId, Guid userId);
}

