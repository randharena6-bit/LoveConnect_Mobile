import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallType, CallStatus } from '../../database/entities/call.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async initiateCall(callerId: string, calleeId: string, callType: CallType): Promise<Call> {
    if (callerId === calleeId) {
      throw new ForbiddenException('Cannot call yourself');
    }

    const callee = await this.userRepository.findOne({ where: { id: calleeId } });
    if (!callee) throw new NotFoundException('User not found');

    const call = this.callRepository.create({
      callerId,
      calleeId,
      callType,
      status: CallStatus.INITIATED,
    });

    return this.callRepository.save(call);
  }

  async acceptCall(callId: string, userId: string): Promise<Call> {
    const call = await this.callRepository.findOne({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');
    if (call.calleeId !== userId) throw new ForbiddenException('Not your call');

    call.status = CallStatus.CONNECTED;
    call.startedAt = new Date();
    return this.callRepository.save(call);
  }

  async rejectCall(callId: string, userId: string): Promise<Call> {
    const call = await this.callRepository.findOne({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');
    if (call.calleeId !== userId) throw new ForbiddenException('Not your call');

    call.status = CallStatus.REJECTED;
    call.endedAt = new Date();
    return this.callRepository.save(call);
  }

  async endCall(callId: string, userId: string): Promise<Call> {
    const call = await this.callRepository.findOne({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');
    if (call.callerId !== userId && call.calleeId !== userId) {
      throw new ForbiddenException('Not part of this call');
    }

    call.status = CallStatus.ENDED;
    call.endedAt = new Date();
    if (call.startedAt) {
      call.durationSeconds = Math.floor(
        (call.endedAt.getTime() - call.startedAt.getTime()) / 1000,
      );
    }
    return this.callRepository.save(call);
  }

  async getCallHistory(userId: string, page = 1, limit = 20) {
    const [calls, total] = await this.callRepository.findAndCount({
      where: [
        { callerId: userId },
        { calleeId: userId },
      ],
      relations: ['caller', 'caller.profile', 'callee', 'callee.profile'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const formatted = calls.map((call) => {
      const otherUser = call.callerId === userId ? call.callee : call.caller;
      return {
        id: call.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.profile?.name,
          profilePictureUrl: otherUser.profile?.profilePictureUrl,
        },
        callType: call.callType,
        status: call.status,
        durationSeconds: call.durationSeconds,
        createdAt: call.createdAt,
      };
    });

    return {
      items: formatted,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}
