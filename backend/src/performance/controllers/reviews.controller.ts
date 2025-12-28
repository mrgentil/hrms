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
import { ReviewsService } from '../services/reviews.service';
import {
  CreateReviewDto,
  CreateBulkReviewsDto,
  SubmitSelfReviewDto,
  SubmitManagerReviewDto,
  FinalizeReviewDto,
  ReviewQueryDto,
} from '../dto/review.dto';

@Controller('performance/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async create(@Body() dto: CreateReviewDto) {
    const review = await this.reviewsService.create(dto);
    return {
      success: true,
      data: review,
      message: 'Review créée avec succès',
    };
  }

  @Post('bulk')
  async createBulk(@Body() dto: CreateBulkReviewsDto, @Request() req: any) {
    const result = await this.reviewsService.createBulk(dto, req.user.id);
    return {
      success: true,
      data: result,
      message: `${result.created} reviews créées, ${result.skipped} ignorées`,
    };
  }

  @Get()
  async findAll(@Query() query: ReviewQueryDto) {
    const result = await this.reviewsService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get('my')
  async findMy(@Request() req: any) {
    const reviews = await this.reviewsService.findMy(req.user.id);
    return {
      success: true,
      data: reviews,
    };
  }

  @Get('team')
  async findTeam(@Request() req: any) {
    const reviews = await this.reviewsService.findTeam(req.user.id);
    return {
      success: true,
      data: reviews,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const review = await this.reviewsService.findOne(id);
    return {
      success: true,
      data: review,
    };
  }

  @Post(':id/self-submit')
  async submitSelf(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitSelfReviewDto,
    @Request() req: any,
  ) {
    const review = await this.reviewsService.submitSelfReview(id, dto, req.user.id);
    return {
      success: true,
      data: review,
      message: 'Auto-évaluation soumise',
    };
  }

  @Post(':id/manager-submit')
  async submitManager(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitManagerReviewDto,
    @Request() req: any,
  ) {
    const review = await this.reviewsService.submitManagerReview(id, dto, req.user.id);
    return {
      success: true,
      data: review,
      message: 'Évaluation manager soumise',
    };
  }

  @Post(':id/finalize')
  async finalize(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinalizeReviewDto,
    @Request() req: any,
  ) {
    const review = await this.reviewsService.finalize(id, dto, req.user.id);
    return {
      success: true,
      data: review,
      message: 'Review finalisée',
    };
  }

  @Get(':id/calculated-score')
  async getCalculatedScore(@Param('id', ParseIntPipe) id: number) {
    const score = await this.reviewsService.calculateFinalScore(id);
    return {
      success: true,
      data: score,
    };
  }
}
