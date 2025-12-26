using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Profile;

namespace NextgenMessanger.API.Controllers;

[ApiController]
[Route("api/users/{username}/profile")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly IUserService _userService;
    private readonly IWebHostEnvironment _environment;

    public ProfilesController(IProfileService profileService, IUserService userService, IWebHostEnvironment environment)
    {
        _profileService = profileService;
        _userService = userService;
        _environment = environment;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile(string username)
    {
        var profile = await _profileService.GetProfileByUsernameAsync(username);
        if (profile == null)
        {
            return NotFound();
        }

        return Ok(profile);
    }

    [HttpPatch]
    public async Task<IActionResult> UpdateProfile(string username, [FromBody] UpdateProfileDto updateDto)
    {
        var user = await _userService.GetByUsernameAsync(username);
        if (user == null)
        {
            return NotFound();
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized();
        }

        if (currentUserId != user.Id)
        {
            return Forbid();
        }

        try
        {
            var profile = await _profileService.UpdateProfileAsync(user.Id, updateDto);
            return Ok(profile);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(string username, IFormFile file)
    {
        var user = await _userService.GetByUsernameAsync(username);
        if (user == null)
        {
            return NotFound();
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized();
        }

        if (currentUserId != user.Id)
        {
            return Forbid();
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded");
        }

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
        {
            return BadRequest("Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.");
        }

        const int maxFileSizeBytes = 5 * 1024 * 1024;
        if (file.Length > maxFileSizeBytes)
        {
            return BadRequest("File too large. Maximum size is 5MB.");
        }

        try
        {
            var avatarsPath = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "avatars");
            if (!Directory.Exists(avatarsPath))
            {
                Directory.CreateDirectory(avatarsPath);
            }

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{user.Id}_{DateTime.UtcNow.Ticks}{fileExtension}";
            var filePath = Path.Combine(avatarsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var avatarUrl = $"/avatars/{fileName}";
            var updateDto = new UpdateProfileDto { AvatarUrl = avatarUrl };
            var profile = await _profileService.UpdateProfileAsync(user.Id, updateDto);

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

