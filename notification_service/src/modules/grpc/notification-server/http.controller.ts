import { Body, Controller, Post } from "@nestjs/common";
import { GrpcService } from "./grpc.service";
import * as notification_1 from "types/proto/notification";

@Controller('grpc-notification')
export class HttpController {
    constructor(private readonly grpcService: GrpcService) {}

    @Post() 
    createNotification(@Body() notification: notification_1.NotificationRequest) {
        return this.grpcService.createNotification(notification);
    }
}