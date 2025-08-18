-- CreateTable
CREATE TABLE "operators_config" (
    "id" SERIAL NOT NULL,
    "selected_users" JSONB[],
    "operator_id" INTEGER NOT NULL,
    "filters" JSONB NOT NULL,

    CONSTRAINT "operators_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_config" (
    "id" SERIAL NOT NULL,
    "filters" JSONB NOT NULL,
    "ticket_id" INTEGER NOT NULL,

    CONSTRAINT "ticket_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operators_config_operator_id_key" ON "operators_config"("operator_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_config_ticket_id_key" ON "ticket_config"("ticket_id");

-- AddForeignKey
ALTER TABLE "operators_config" ADD CONSTRAINT "operators_config_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_config" ADD CONSTRAINT "ticket_config_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
