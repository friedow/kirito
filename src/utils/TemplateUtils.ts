import fs from 'fs';
import handlebars from 'handlebars';
import Pageres from 'pageres';
import path from 'path';
import Toplist from '@/interfaces/Toplist';
import User from '@/utils/User';

export default class TemplateUtil {
  public static async getProfilePng(user: User): Promise<string> {
    const profileTemplateFile = `${__dirname}/../interface/templates/profile.html`;
    return TemplateUtil.hbsToPng(profileTemplateFile, user);
  }

  public static async getToplistPng(toplist: Toplist): Promise<string> {
    const toplistTemplateFile = `${__dirname}/../interface/templates/toplist.html`;
    return TemplateUtil.hbsToPng(toplistTemplateFile, toplist);
  }

  private static async hbsToPng(templateFile: string, templateContext: any): Promise<string> {
    const randomFilename = Math.random().toString(36).substring(7);
    const htmlFile = `${__dirname}/../interface/${randomFilename}.html`;
    const pngFile = `${__dirname}/../interface/${randomFilename}.png`;

    TemplateUtil.hbsToHtml(templateFile, templateContext, htmlFile);
    await TemplateUtil.htmlToPng(htmlFile, pngFile);

    return pngFile;
  }

  private static hbsToHtml(file: string, context: any, outputFile: string): string {
    const templateFile = fs.readFileSync(file).toString();
    const template = handlebars.compile(templateFile);
    const html = template(context);
    fs.writeFileSync(outputFile, html);
    return outputFile;
  }

  private static async htmlToPng(file: string, outputFile: string): Promise<string> {
    const outputFilename = path.basename(outputFile, '.png');
    await new Pageres()
      .src(file, ['500x1000'], {crop: true, selector: '.main', filename: outputFilename})
      .dest(path.dirname(file))
      .run();

    return outputFile;
  }
}
