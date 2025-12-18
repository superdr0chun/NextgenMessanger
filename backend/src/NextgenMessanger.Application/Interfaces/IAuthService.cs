using NextgenMessanger.Core.DTOs.Auth;
using NextgenMessanger.Core.DTOs.User;

namespace NextgenMessanger.Application.Interfaces;

public interface IAuthService
{
    Task<UserDto> RegisterAsync(RegisterDto registerDto);
    Task<TokenDto> LoginAsync(LoginDto loginDto);
    Task<TokenDto> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
}

