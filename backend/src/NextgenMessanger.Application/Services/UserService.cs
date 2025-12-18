using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.User;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto?> GetByIdAsync(Guid id)
    {
        var user = await _context.Users
            .Where(u => u.Id == id && !u.Deleted)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                Username = u.Username,
                FullName = u.FullName,
                EmailVerified = u.EmailVerified,
                CreatedAt = u.CreatedAt
            })
            .FirstOrDefaultAsync();

        return user;
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId)
    {
        return await GetByIdAsync(userId);
    }

    public async Task<IEnumerable<UserSearchDto>> SearchUsersAsync(string? query, int page = 1, int pageSize = 20)
    {
        var usersQuery = _context.Users
            .Where(u => !u.Deleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var searchTerm = query;
            usersQuery = usersQuery.Where(u =>
                u.Username.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                (u.FullName != null && u.FullName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                u.Email.Contains(searchTerm, StringComparison.OrdinalIgnoreCase));
        }

        var users = await usersQuery
            .OrderBy(u => u.Username)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserSearchDto
            {
                Id = u.Id,
                Email = u.Email,
                Username = u.Username,
                FullName = u.FullName,
                AvatarUrl = u.Profile != null ? u.Profile.AvatarUrl : null
            })
            .ToListAsync();

        return users;
    }

    public async Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto updateDto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.Deleted);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        if (!string.IsNullOrWhiteSpace(updateDto.FullName))
        {
            user.FullName = updateDto.FullName;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            FullName = user.FullName,
            EmailVerified = user.EmailVerified,
            CreatedAt = user.CreatedAt
        };
    }
}

