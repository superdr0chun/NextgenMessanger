using NextgenMessanger.Core.DTOs.Post;

namespace NextgenMessanger.Application.Interfaces;

public interface IPostService
{
    Task<PostDto> CreatePostAsync(Guid authorId, CreatePostDto createDto);
    Task<PostDto?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null);
    Task<IEnumerable<PostDto>> GetPostsAsync(int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<IEnumerable<PostDto>> GetUserPostsAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<IEnumerable<PostDto>> GetFeedAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<PostDto> UpdatePostAsync(Guid postId, Guid userId, UpdatePostDto updateDto);
    Task DeletePostAsync(Guid postId, Guid userId);
}

