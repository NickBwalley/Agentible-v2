declare module "mailparser" {
  export function simpleParser(
    source: Buffer | string | NodeJS.ReadableStream,
    options?: unknown
  ): Promise<{
    messageId?: string;
    inReplyTo?: string;
    references?: string | string[];
    subject?: string;
    text?: string;
    date?: Date;
    [key: string]: unknown;
  }>;
}
