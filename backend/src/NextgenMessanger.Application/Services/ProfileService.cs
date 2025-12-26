using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Profile;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class ProfileService : IProfileService
{
    private readonly ApplicationDbContext _context;

    public ProfileService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProfileDto?> GetProfileByUserIdAsync(Guid userId)
    {
        var profile = await _context.Profiles
            .Where(p => p.UserId == userId && !p.Deleted)
            .Select(p => new ProfileDto
            {
                UserId = p.UserId,
                AvatarUrl = p.AvatarUrl,
                Bio = p.Bio,
                Phone = p.Phone,
                Location = p.Location,
                DateOfBirth = p.DateOfBirth,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .FirstOrDefaultAsync();

        return profile;
    }

    public async Task<ProfileDto?> GetProfileByUsernameAsync(string username)
    {
        var profile = await _context.Profiles
            .Where(p => p.User.Username == username && !p.Deleted && !p.User.Deleted)
            .Select(p => new ProfileDto
            {
                UserId = p.UserId,
                AvatarUrl = p.AvatarUrl,
                Bio = p.Bio,
                Phone = p.Phone,
                Location = p.Location,
                DateOfBirth = p.DateOfBirth,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .FirstOrDefaultAsync();

        return profile;
    }

    public async Task<ProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto updateDto)
    {
        var profile = await _context.Profiles
            .FirstOrDefaultAsync(p => p.UserId == userId && !p.Deleted);

        if (profile == null)
        {
            throw new KeyNotFoundException("Profile not found");
        }

        if (updateDto.AvatarUrl != null)
        {
            profile.AvatarUrl = updateDto.AvatarUrl;
        }

        if (updateDto.Bio != null)
        {
            profile.Bio = updateDto.Bio;
        }

        if (updateDto.Phone != null)
        {
            profile.Phone = updateDto.Phone;
        }

        if (updateDto.Location != null)
        {
            profile.Location = updateDto.Location;
        }

        if (updateDto.DateOfBirth.HasValue)
        {
            profile.DateOfBirth = updateDto.DateOfBirth;
        }

        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new ProfileDto
        {
            UserId = profile.UserId,
            AvatarUrl = profile.AvatarUrl,
            Bio = profile.Bio,
            Phone = profile.Phone,
            Location = profile.Location,
            DateOfBirth = profile.DateOfBirth,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt
        };
    }
}

