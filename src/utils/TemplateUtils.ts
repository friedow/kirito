import fs from 'fs';
import handlebars from 'handlebars';
import Pageres from 'pageres';
import path from 'path';
import UserProfile from '@/interfaces/UserProfile';

export default class TemplateUtil {
  public static async getProfilePng(profile: UserProfile): Promise<string> {
    const profileTemplateFile = `${process.cwd()}/src/interface/templates/profile.html`;
    return TemplateUtil.hbsToPng(profileTemplateFile, profile);
  }

  private static async hbsToPng(templateFile: string, templateContext: any): Promise<string> {
    const randomFilename = Math.random().toString(36).substring(7);
    const htmlFile = `${process.cwd()}/src/interface/${randomFilename}.html`;
    const pngFile = `${process.cwd()}/src/interface/${randomFilename}.png`;

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
