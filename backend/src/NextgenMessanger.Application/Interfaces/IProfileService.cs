using NextgenMessanger.Core.DTOs.Profile;

namespace NextgenMessanger.Application.Interfaces;

public interface IProfileService
{
    Task<ProfileDto?> GetProfileByUserIdAsync(Guid userId);
    Task<ProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto updateDto);
}

