import { Response } from 'express';
import { CustomHttpResponse } from 'src/utils/custom-http-response';

export function sendAuthResponse(
  response: Response,
  clientType: string,
  tokens: { accessToken: string; refreshToken: string },
  user?: any,
) {
  const { accessToken, refreshToken } = tokens;

  if (clientType === 'web') {
    // Set access token in httpOnly cookie for web clients
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes (short-lived)
      path: '/',
    });

    // Set refresh token in httpOnly cookie for web clients
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh', // Only send to refresh endpoint
    });

    return new CustomHttpResponse({
      message: 'Authentication successful',
      user: {
        id: user?.id,
        email: user?.email,
        phone: user?.phone,
        name: user?.fullName,
        role: user?.role,
        isverified: user?.isVerified,
        is18: user?.is18,
        createdAt: user?.createdAt,
      },
    });
  } else {
    // Mobile clients receive tokens in response body
    return new CustomHttpResponse({
      accessToken,
      refreshToken,
      user: {
        id: user?.id,
        email: user?.email,
        phone: user?.phone,
        name: user?.fullName,
        role: user?.role,
        isverified: user?.isVerified,
        is18: user?.is18,
        createdAt: user?.createdAt,
      },
    });
  }
}

export function clearAuthCookies(response: Response) {
  response.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  response.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth/refresh',
  });
}
