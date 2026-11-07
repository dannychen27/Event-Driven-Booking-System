import type { DatabaseService } from "../../../4. backend/src/database/database.service";

export interface InjectExpiredHoldOptions {
    db: DatabaseService;
    holdId: number;
}
