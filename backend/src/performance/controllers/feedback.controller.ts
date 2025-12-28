import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { FeedbackService } from '../services/feedback.service';
import {
  RequestFeedbackDto,
  SubmitFeedbackDto,
  FeedbackQueryDto,
} from '../dto/feedback.dto';

@Controller('performance/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('request')
  async requestFeedback(@Body() dto: RequestFeedbackDto, @Request() req: any) {
    const result = await this.feedbackService.requestFeedback(dto, req.user.id);
    return {
      success: true,
      data: result,
      message: `${result.created} demandes de feedback envoyées`,
    };
  }

  @Get('pending')
  async findPending(@Request() req: any) {
    const feedbacks = await this.feedbackService.findPending(req.user.id);
    return {
      success: true,
      data: feedbacks,
    };
  }

  @Get('review/:reviewId')
  async findByReview(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Request() req: any,
  ) {
    const feedbacks = await this.feedbackService.findByReview(reviewId, req.user.id);
    return {
      success: true,
      data: feedbacks,
    };
  }

  @Get('review/:reviewId/aggregated')
  async getAggregated(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Request() req: any,
  ) {
    const aggregated = await this.feedbackService.getAggregatedFeedback(
      reviewId,
      req.user.id,
    );
    return {
      success: true,
      data: aggregated,
    };
  }

  @Post(':id/submit')
  async submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitFeedbackDto,
    @Request() req: any,
  ) {
    const feedback = await this.feedbackService.submit(id, dto, req.user.id);
    return {
      success: true,
      data: feedback,
      message: 'Feedback soumis avec succès',
    };
  }

  @Post(':id/decline')
  async decline(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const feedback = await this.feedbackService.decline(id, req.user.id);
    return {
      success: true,
      data: feedback,
      message: 'Demande de feedback déclinée',
    };
  }

  @Post(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.feedbackService.cancelRequest(id, req.user.id);
    return {
      success: true,
      message: 'Demande de feedback annulée',
    };
  }
}
