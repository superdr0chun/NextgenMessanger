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
    private readonly IWebHostEnvironment _environment;

    public ProfilesController(IProfileService profileService, IWebHostEnvironment environment)
    {
        _profileService = profileService;
        _environment = environment;
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

    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(Guid userId, IFormFile file)
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

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded");
        }

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
        {
            return BadRequest("Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.");
        }

        // Validate file size (max 5MB)
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest("File too large. Maximum size is 5MB.");
        }

        try
        {
            // Create avatars directory if it doesn't exist
            var avatarsPath = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "avatars");
            if (!Directory.Exists(avatarsPath))
            {
                Directory.CreateDirectory(avatarsPath);
            }

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{userId}_{DateTime.UtcNow.Ticks}{fileExtension}";
            var filePath = Path.Combine(avatarsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update profile with new avatar URL
            var avatarUrl = $"/avatars/{fileName}";
            var updateDto = new UpdateProfileDto { AvatarUrl = avatarUrl };
            var profile = await _profileService.UpdateProfileAsync(userId, updateDto);

            return Ok(new { avatarUrl = avatarUrl, profile = profile });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error uploading file: {ex.Message}");
        }
    }
}

