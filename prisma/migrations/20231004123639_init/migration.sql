-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "chat_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "last_message" TEXT NOT NULL,
    "is_block" BOOLEAN NOT NULL DEFAULT false,
    "phone_number" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "is_online" BOOLEAN NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" JSONB,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "last_message" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "request_close" BOOLEAN NOT NULL DEFAULT false,
    "operator_id" INTEGER,
    "rate" INTEGER,
    "last_request_user" TEXT,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operators" (
    "id" SERIAL NOT NULL,
    "firs_name" TEXT,
    "last_name" TEXT,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_id" INTEGER,
    "socket_id" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(5) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticket_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "operator_id" INTEGER,
    "created_at" TIMESTAMP(5) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_answer" INTEGER NOT NULL,
    "content_type" TEXT NOT NULL,
    "bot_id" BIGINT,
    "is_ready" BOOLEAN NOT NULL DEFAULT false,
    "ticket_id" INTEGER NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
