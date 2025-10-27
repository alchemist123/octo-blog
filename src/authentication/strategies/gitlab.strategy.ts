import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-gitlab2';
import { AuthService } from '../auth.service';

@Injectable()
export class GitLabStrategy extends PassportStrategy(Strategy, 'gitlab') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GITLAB_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GITLAB_CLIENT_SECRET || 'dummy-client-secret',
      callbackURL:
        process.env.GITLAB_CALLBACK_URL ||
        'http://localhost:3000/auth/gitlab/callback',
      scope: 'read_user',
      baseURL: process.env.GITLAB_BASE_URL || 'https://gitlab.com',
    } as any);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, username, displayName, photos, _json } = profile;
    const user = {
      providerId: id.toString(),
      email: _json.email || `${username}@gitlab.com`,
      name: displayName || _json.name || username,
      userName: username,
      dp_url: photos[0]?.value || _json.avatar_url,
      provider: 'gitlab',
      bio: _json.bio || '',
    };
    done(null, user);
  }
}
