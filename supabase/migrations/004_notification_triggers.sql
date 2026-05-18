-- ─── Trigger: notificar admins quando novo pedido é criado ───────────────────

CREATE OR REPLACE FUNCTION notify_admins_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, order_id, read)
  SELECT id,
    'Novo pedido recebido 🎣',
    'Pedido "' || NEW.title || '" foi criado e aguarda atenção.',
    'new_order',
    NEW.id,
    false
  FROM profiles
  WHERE role = 'admin'
    AND id != NEW.created_by; -- não notifica se admin criou o próprio pedido
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_created ON orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_admins_new_order();


-- ─── Trigger: notificar quando comentário é adicionado ───────────────────────

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  order_creator_id UUID;
  commenter_role   TEXT;
  commenter_name   TEXT;
BEGIN
  SELECT created_by INTO order_creator_id FROM orders WHERE id = NEW.order_id;
  SELECT role, full_name INTO commenter_role, commenter_name FROM profiles WHERE id = NEW.author_id;

  IF commenter_role = 'admin' THEN
    -- Admin comentou → notifica o dono do pedido (se não for admin)
    IF order_creator_id != NEW.author_id THEN
      INSERT INTO notifications (user_id, title, message, type, order_id, read)
      VALUES (
        order_creator_id,
        'Novo comentário da equipe 💬',
        commenter_name || ' comentou no seu pedido.',
        'comment_added', NEW.order_id, false
      );
    END IF;
  ELSE
    -- Cliente comentou → notifica todos os admins
    INSERT INTO notifications (user_id, title, message, type, order_id, read)
    SELECT id,
      'Cliente comentou em um pedido 💬',
      commenter_name || ' deixou um comentário aguardando resposta.',
      'comment_added', NEW.order_id, false
    FROM profiles
    WHERE role = 'admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();


-- ─── Trigger: notificar cliente quando arquivo é enviado pelo admin ───────────

CREATE OR REPLACE FUNCTION notify_on_attachment()
RETURNS TRIGGER AS $$
DECLARE
  order_creator_id UUID;
  uploader_role    TEXT;
  uploader_name    TEXT;
BEGIN
  SELECT created_by INTO order_creator_id FROM orders WHERE id = NEW.order_id;
  SELECT role, full_name INTO uploader_role, uploader_name FROM profiles WHERE id = NEW.uploaded_by;

  -- Só notifica se admin enviou arquivo (prévia ou final para o cliente)
  IF uploader_role = 'admin' AND order_creator_id != NEW.uploaded_by THEN
    INSERT INTO notifications (user_id, title, message, type, order_id, read)
    VALUES (
      order_creator_id,
      CASE
        WHEN NEW.is_preview THEN 'Prévia enviada! 👀'
        WHEN NEW.is_final   THEN 'Arquivo final disponível ✅'
        ELSE 'Novo arquivo no pedido 📎'
      END,
      uploader_name || ' enviou um arquivo no seu pedido.',
      'attachment_added', NEW.order_id, false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_attachment_created ON order_attachments;
CREATE TRIGGER on_attachment_created
  AFTER INSERT ON order_attachments
  FOR EACH ROW EXECUTE FUNCTION notify_on_attachment();
