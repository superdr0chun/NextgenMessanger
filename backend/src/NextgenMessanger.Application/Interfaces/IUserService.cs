using NextgenMessanger.Core.DTOs.User;

namespace NextgenMessanger.Application.Interfaces;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(Guid id);
    Task<UserDto?> GetByUsernameAsync(string username);
    Task<UserDto?> GetCurrentUserAsync(Guid userId);
    Task<IEnumerable<UserSearchDto>> SearchUsersAsync(string? query, int page = 1, int pageSize = 20);
    Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto updateDto);
}

