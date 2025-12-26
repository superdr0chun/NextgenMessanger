using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.Constants;
using NextgenMessanger.Core.DTOs.Auth;
using NextgenMessanger.Core.DTOs.User;
using NextgenMessanger.Core.Entities;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IJwtService jwtService, IConfiguration configuration)
    {
        _context = context;
        _jwtService = jwtService;
        _configuration = configuration;
    }

    public async Task<UserDto> RegisterAsync(RegisterDto registerDto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
        {
            throw new InvalidOperationException("Email already exists");
        }

        if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
        {
            throw new InvalidOperationException("Username already exists");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = registerDto.Email,
            Username = registerDto.Username,
            PasswordHash = passwordHash,
            FullName = registerDto.FullName,
            Status = UserConstants.StatusActive,
            EmailVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Deleted = false
        };

        var profile = new Profile
        {
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Deleted = false
        };

        _context.Users.Add(user);
        _context.Profiles.Add(profile);
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

    public async Task<TokenDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == loginDto.Email && !u.Deleted);

        if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenExpirationDaysStr = _configuration["Jwt:RefreshExpirationDays"];
        var refreshTokenExpirationDays = int.TryParse(refreshTokenExpirationDaysStr, out var refreshDays) 
            ? refreshDays 
            : TimeConstants.RefreshTokenExpirationDays;
        
        var accessTokenExpirationMinutesStr = _configuration["Jwt:ExpirationMinutes"];
        var accessTokenExpirationMinutes = int.TryParse(accessTokenExpirationMinutesStr, out var accessMinutes) 
            ? accessMinutes 
            : TimeConstants.AccessTokenExpirationMinutes;

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Deleted = false
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return new TokenDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(accessTokenExpirationMinutes)
        };
    }

    public async Task<TokenDto> RefreshTokenAsync(string refreshToken)
    {
        var tokenEntity = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken 
                && !rt.Deleted 
                && rt.RevokedAt == null 
                && rt.ExpiresAt > DateTime.UtcNow);

        if (tokenEntity == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        var user = tokenEntity.User;
        if (user.Deleted)
        {
            throw new UnauthorizedAccessException("User is deleted");
        }

        tokenEntity.RevokedAt = DateTime.UtcNow;
        tokenEntity.UpdatedAt = DateTime.UtcNow;

        var newAccessToken = _jwtService.GenerateAccessToken(user);
        var newRefreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenExpirationDaysStr = _configuration["Jwt:RefreshExpirationDays"];
        var refreshTokenExpirationDays = int.TryParse(refreshTokenExpirationDaysStr, out var refreshDays) 
            ? refreshDays 
            : TimeConstants.RefreshTokenExpirationDays;
        
        var accessTokenExpirationMinutesStr = _configuration["Jwt:ExpirationMinutes"];
        var accessTokenExpirationMinutes = int.TryParse(accessTokenExpirationMinutesStr, out var accessMinutes) 
            ? accessMinutes 
            : TimeConstants.AccessTokenExpirationMinutes;

        var newRefreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Deleted = false
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync();

        return new TokenDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(accessTokenExpirationMinutes)
        };
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var tokenEntity = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.Deleted);

        if (tokenEntity != null)
        {
            tokenEntity.RevokedAt = DateTime.UtcNow;
            tokenEntity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}

