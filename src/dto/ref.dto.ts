export class UniqueStartPayloadDto {
  payload: string;
  count: number;
}

export class GetRefDataDto {
  undefinedCount: number;
  uniqueStartPayloads: UniqueStartPayloadDto[];
}
