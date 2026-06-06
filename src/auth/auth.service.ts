import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AdminUser, AdminUserDocument } from './schemas/admin-user.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { SignInDto, SignUpDto } from '../users/dto/user-auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(AdminUser.name)
    private adminModel: Model<AdminUserDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const email =
      this.config.get<string>('ADMIN_EMAIL') || 'admin@smartlib.local';
    const password = this.config.get<string>('ADMIN_PASSWORD') || 'admin123';
    const existing = await this.adminModel.findOne({ email }).exec();
    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 10);
      await this.adminModel.create({ email, passwordHash, role: 'admin' });
      console.log(`Default admin created: ${email}`);
    }
  }

  /** Admin login (HTML panel). */
  async login(dto: LoginDto) {
    const user = await this.adminModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user._id.toString(), email: user.email, role: 'admin' };
    return {
      accessToken: this.jwtService.sign(payload),
      email: user.email,
      role: user.role,
    };
  }

  /** User sign up. */
  async signUp(dto: SignUpDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email,
      passwordHash,
      displayName: dto.displayName?.trim() ?? '',
    });
    return this.tokenForUser(user);
  }

  /** User sign in. */
  async signIn(dto: SignInDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase().trim() })
      .exec();
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.tokenForUser(user);
  }

  private tokenForUser(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email, role: 'user' };
    return {
      accessToken: this.jwtService.sign(payload),
      email: user.email,
      displayName: user.displayName,
      role: 'user',
    };
  }
}
