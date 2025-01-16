// src/decorators/validate-media-params.decorator.ts
// import {
//   createParamDecorator,
//   ExecutionContext,
//   BadRequestException,
// } from '@nestjs/common';
// import { MediaType } from '../media/types';

// export const ValidateMediaParams = createParamDecorator(
//   (data: unknown, ctx: ExecutionContext) => {
//     const request = ctx.switchToHttp().getRequest();
//     const { media_type, series_name, season_name, filename } = request.query;

//     switch (media_type) {
//       case MediaType.MOVIE:
//         if (!filename) {
//           throw new BadRequestException('Filename is required for movies');
//         }
//         break;
//       case MediaType.SERIES:
//         if (!series_name || !season_name || !filename) {
//           throw new BadRequestException(
//             'Series name, season, and filename are required for series',
//           );
//         }
//         break;
//       case MediaType.MOVIE_SERIES:
//         if (!series_name || !filename) {
//           throw new BadRequestException(
//             'Movie series name and filename are required for movie series',
//           );
//         }
//         break;
//       default:
//         throw new BadRequestException('Invalid media type');
//     }

//     return {
//       media_type,
//       series_name,
//       season_name,
//       filename,
//     };
//   },
// );
