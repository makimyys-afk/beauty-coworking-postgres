import { getDb } from "./db";
import { sqlLogs } from "../drizzle/schema";

export interface SqlLogEntry {
  query: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "OTHER";
  executionTime?: number;
  userId?: number;
  endpoint?: string;
  params?: string;
  error?: string;
}

/**
 * Логирование SQL-запроса в базу данных
 */
export async function logSqlQuery(entry: SqlLogEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[SQL Logger] Database not available");
      return;
    }

    await db.insert(sqlLogs).values({
      query: entry.query,
      operation: entry.operation,
      executionTime: entry.executionTime,
      userId: entry.userId,
      endpoint: entry.endpoint,
      params: entry.params,
      error: entry.error,
    });
  } catch (error) {
    // Не логируем ошибки логирования, чтобы избежать бесконечной рекурсии
    console.error("[SQL Logger] Failed to log query:", error);
  }
}

/**
 * Определение типа операции по SQL-запросу
 */
export function detectOperation(query: string): "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "OTHER" {
  const normalizedQuery = query.trim().toUpperCase();
  
  if (normalizedQuery.startsWith("SELECT")) return "SELECT";
  if (normalizedQuery.startsWith("INSERT")) return "INSERT";
  if (normalizedQuery.startsWith("UPDATE")) return "UPDATE";
  if (normalizedQuery.startsWith("DELETE")) return "DELETE";
  
  return "OTHER";
}

/**
 * Wrapper для выполнения запросов с логированием
 */
export async function executeWithLogging<T>(
  queryFn: () => Promise<T>,
  queryString: string,
  userId?: number,
  endpoint?: string,
  params?: any
): Promise<T> {
  const startTime = Date.now();
  let error: string | undefined;

  try {
    const result = await queryFn();
    const executionTime = Date.now() - startTime;

    // Логируем успешный запрос
    await logSqlQuery({
      query: queryString,
      operation: detectOperation(queryString),
      executionTime,
      userId,
      endpoint,
      params: params ? JSON.stringify(params) : undefined,
    });

    return result;
  } catch (err) {
    const executionTime = Date.now() - startTime;
    error = err instanceof Error ? err.message : String(err);

    // Логируем запрос с ошибкой
    await logSqlQuery({
      query: queryString,
      operation: detectOperation(queryString),
      executionTime,
      userId,
      endpoint,
      params: params ? JSON.stringify(params) : undefined,
      error,
    });

    throw err;
  }
}
