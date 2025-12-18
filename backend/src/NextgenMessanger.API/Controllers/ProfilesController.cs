using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Profile;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/users/{userId}/profile")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfilesController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile(Guid userId)
    {
        var profile = await _profileService.GetProfileByUserIdAsync(userId);
        if (profile == null)
        {
            return NotFound();
        }

        return Ok(profile);
    }

    [HttpPatch]
    public async Task<IActionResult> UpdateProfile(Guid userId, [FromBody] UpdateProfileDto updateDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized();
        }

        if (currentUserId != userId)
        {
            return Forbid();
        }

        try
        {
            var profile = await _profileService.UpdateProfileAsync(userId, updateDto);
            return Ok(profile);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}

