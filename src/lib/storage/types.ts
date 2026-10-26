export interface StoredFile {
  /** Публичный адрес для <img src> */
  url: string;
  /** Ключ в хранилище — по нему файл удаляется */
  key: string;
}

export interface SaveFileInput {
  data: Uint8Array;
  contentType: string;
  /** Без точки: jpg, png, webp */
  extension: string;
  /** Папка внутри хранилища, например "posters" */
  folder: string;
}

/**
 * Хранилище загруженных файлов. Сейчас — диск (public/uploads);
 * для S3 или Cloudinary нужна своя реализация этого интерфейса — остальной код не меняется.
 */
export interface FileStorage {
  save(input: SaveFileInput): Promise<StoredFile>;
  /** Удалить по публичному адресу; чужие адреса (не из этого хранилища) игнорируются */
  deleteByUrl(url: string): Promise<void>;
}
