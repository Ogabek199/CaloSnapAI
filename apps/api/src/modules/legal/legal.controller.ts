import { Controller, Get, Header, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { LEGAL_LANGS, LEGAL_PAGES, LegalLang, LegalPage } from '@eda/legal';
import { renderLegalPage } from './legal.render';

const LANGS = new Set<string>(LEGAL_LANGS);

/** Public pages linked from the app and the App Store / Google Play listings. */
@ApiExcludeController()
@Controller('legal')
export class LegalController {
  @Get(':page')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  getPage(@Param('page') page: string, @Query('lang') lang?: string) {
    if (!LEGAL_PAGES.includes(page as LegalPage)) throw new NotFoundException();
    const l: LegalLang = lang && LANGS.has(lang) ? (lang as LegalLang) : lang ? 'en' : 'uz';
    return renderLegalPage(page as LegalPage, l);
  }
}
