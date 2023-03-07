import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/jwt-auth/jwt-auth.guard';
import { BookService } from './book.service';
import { GetBooksDTO, GetBooksResponseDTO } from './dto/get-books.dto';
import {
  ApiResponseDataDTO,
  ApiResponsePagenationDataDTO,
} from 'src/common/api-response/api-response-data.dto';
import { CreateBookDTO } from './dto/create-book.dto';
import { Request } from 'express';
import { GetURLsForBookImgDirectUploadingResponseDTO } from './dto/get-direct-upload-url';
import {
  BookIdDTO,
  BookLikeCountResponseDTO,
  BookLikeStatusResponseDTO,
  BookResponseDTO,
} from './dto/book.dto';
import { UpdateMyBookDTO } from './dto/update-my-book.dto';
import { Jwt } from 'src/common/jwt-auth/jwt.decorator';

@Controller('book')
@ApiTags('Book')
export class BookController {
  constructor(private readonly bookSerivce: BookService) {}

  @Get()
  @ApiOperation({
    summary: '노래책 목록 조회',
    description: '최신순/추천순/인기순 노래책 목록 조회 엔드포인트',
  })
  @ApiOkResponse({
    description: '노래책 목록 조회 성공',
    type: GetBooksResponseDTO,
  })
  async getBooks(@Query() _query: GetBooksDTO) {
    const { perPage = 30, page = 1, sort = 'newest' } = _query;
    const books = await this.bookSerivce.getBooks(perPage, page, sort);
    return new ApiResponsePagenationDataDTO<{ sort: MusicbookSortMethod }>(
      {
        perPage,
        currentPage: page,
        sort,
        pageItemCount: books.length,
      },
      books,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/img_upload_url')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '노래책 썸네일 및 배경 이미지 Direct upload URL 획득',
    description:
      '노래책 썸네일 및 배경 이미지를 Cloudflare images에 Direct upload하기 위한 URL 획득 엔드포인트. 10분 동안 최대 3번 요청 가능.',
  })
  @ApiOkResponse({
    description: 'Direct upload URL 획득',
    type: GetURLsForBookImgDirectUploadingResponseDTO,
  })
  async getURLsForBookImgDirectUploading(
    @Jwt() _jwt: MusicbookJwtPayload,
    @Req() _req: Request,
  ): Promise<GetURLsForBookImgDirectUploadingResponseDTO> {
    return new ApiResponseDataDTO(
      await this.bookSerivce.getURLsForBookImgDirectUploading(_jwt, _req.ip),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: '노래책 생성',
    description:
      '노래책 생성 엔드포인트. 한 사용자 당 하나의 노래책만 생성 가능. 복수개의 노래책 생성 시도시 400에러 발생.',
  })
  @ApiOkResponse({
    description: '노래책 생성 성공',
    type: BookResponseDTO,
  })
  async createBook(
    @Jwt() _jwt: MusicbookJwtPayload,
    @Body() _body: CreateBookDTO,
  ): Promise<BookResponseDTO> {
    return new ApiResponseDataDTO(
      await this.bookSerivce.createBook(_jwt, _body),
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: '본인 노래책 조회',
    description:
      '사용자 본인의 노래책 조회. JWT를 통해 노래책 조회. 생성된 노래책이 없을 경우 400에러 발생.',
  })
  @ApiOkResponse({
    description: '노래책 조회 성공',
    type: BookResponseDTO,
  })
  async getMyBook(@Jwt() _jwt: MusicbookJwtPayload): Promise<BookResponseDTO> {
    return new ApiResponseDataDTO(await this.bookSerivce.getMyBook(_jwt));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({
    summary: '본인 노래책 수정',
    description:
      '사용자 본인의 노래책 수정. 생성된 노래책이 없을 경우 400에러 발생.',
  })
  @ApiOkResponse({
    description: '노래책 수정 성공',
  })
  async updateMyBook(
    @Jwt() _jwt: MusicbookJwtPayload,
    @Body() _body: UpdateMyBookDTO,
  ) {
    await this.bookSerivce.updateMyBook(_jwt, _body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('me')
  @ApiOperation({
    summary: '본인 노래책 삭제',
    description:
      '사용자 본인의 노래책 삭제. 생성된 노래책이 없을 경우 400에러 발생.',
  })
  async deleteMyBook(@Jwt() _jwt: MusicbookJwtPayload) {
    await this.bookSerivce.deleteMyBook(_jwt);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/like')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '본인 노래책 좋아요 개수 조회',
    description:
      '특정 노래책에 대한 좋아요 개수를 조회하는 엔드포인트. 존재하지 않는 노래책일 경우 400에러 발생.',
  })
  @ApiOkResponse({
    description: '노래책 좋아요 개수 조회 성공',
    type: BookLikeCountResponseDTO,
  })
  async getMyBookLikeCount(
    @Jwt() _jwt: MusicbookJwtPayload,
  ): Promise<BookLikeCountResponseDTO> {
    return new ApiResponseDataDTO(
      await this.bookSerivce.getMyBookLikeCount(_jwt),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: '특정 사용자 노래책 조회',
    description:
      '특정 사용자의 노래책 조회. 생성된 노래책이 없을 경우 404에러 발생.',
  })
  @ApiOkResponse({
    description: '노래책 조회 성공',
    type: BookResponseDTO,
  })
  async getBook(@Param() _param: BookIdDTO) {
    const { id } = _param;
    return new ApiResponseDataDTO(await this.bookSerivce.getBook(id));
  }

  @Get(':id/like')
  @ApiOperation({
    summary: '노래책 좋아요 개수 조회',
    description:
      '특정 노래책에 대한 좋아요 개수를 조회하는 엔드포인트. 존재하지 않는 노래책일 경우 400에러 발생.',
  })
  @ApiOkResponse({
    description: '노래책 조회 성공',
    type: BookLikeCountResponseDTO,
  })
  async getLikeCountOfBook(
    @Param() _param: BookIdDTO,
  ): Promise<BookLikeCountResponseDTO> {
    const { id } = _param;
    return new ApiResponseDataDTO(
      await this.bookSerivce.getLikeCountOfBook(id),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '노래책 좋아요 생성',
    description:
      '특정 노래책에 대한 좋아요를 생성하는 엔드포인트. 존재하지 않는 노래책일 경우 400에러 발생.',
  })
  @ApiOkResponse({
    description: '노래책 좋아요 여부 생성 성공',
  })
  async createLikeOfBook(
    @Jwt() _jwt: MusicbookJwtPayload,
    @Param() _param: BookIdDTO,
  ) {
    const { id } = _param;
    await this.bookSerivce.createLikeOfBook(_jwt, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '노래책 좋아요 삭제',
    description:
      '특정 노래책에 대한 좋아요를 삭제하는 엔드포인트. 존재하지 않는 노래책일 경우 400에러 발생.',
  })
  async deleteLikeOfBook(
    @Jwt() _jwt: MusicbookJwtPayload,
    @Param() _param: BookIdDTO,
  ) {
    const { id } = _param;
    await this.bookSerivce.deleteLikeOfBook(_jwt, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/like/me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '노래책 좋아요 여부 조회',
    description:
      '특정 노래책에 대한 좋아요 여부를 조회하는 엔드포인트. 존재하지 않는 노래책일 경우 400에러 발생.',
  })
  @ApiOkResponse({
    description: '노래책 좋아요 여부 조회 성공',
    type: BookLikeStatusResponseDTO,
  })
  async getMyLikeOfBook(
    @Jwt() _jwt: MusicbookJwtPayload,
    @Param() _param: BookIdDTO,
  ): Promise<BookLikeStatusResponseDTO> {
    const { id } = _param;
    return new ApiResponseDataDTO(
      await this.bookSerivce.getMyLikeOfBook(_jwt, id),
    );
  }
}
