import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useEditFeedPost } from "@/hooks/useEditFeedPost";
import { useDeleteFeedPost } from "@/hooks/useDeleteFeedPost";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { CommentSection } from "@/components/comments/CommentSection";
import { RelationshipRequestDialog } from "@/components/car/relationship/RelationshipRequestDialog";
import type { FeedPost } from "@/hooks/useFeedPosts";
import { getPostImages, isCarUnknown, type CarRow } from "@/lib/feedPostPresentation";
import { shareFeedPost } from "@/lib/shareFeedPost";
import { FeedPostCard } from "./FeedPostCard";

type Props = {
  post: FeedPost;
  variant?: "default" | "explore";
  theme?: "light" | "dark";
};

export function FeedCard({ post, variant = "default", theme = "dark" }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: myProfile } = useMyPersonProfile();
  const { mutateAsync: editPost, isPending: isEditPending } = useEditFeedPost();
  const { mutate: deletePost } = useDeleteFeedPost();

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body ?? "");
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRelationship, setShowRelationship] = useState(false);

  const author = (post as { author?: { id?: string; slug?: string; display_name?: string; avatar_url?: string | null } }).author ?? null;
  const isOwn = !!(myProfile && author?.id === myProfile.id);
  const resolvedTheme = variant === "explore" ? "light" : theme;

  const images = getPostImages(post);
  const car = (post as { car?: CarRow | null }).car ?? null;
  const canRequestRelationship = !!car?.id && isCarUnknown(car);

  async function handleSaveEdit() {
    try {
      await editPost({ id: post.id, body: editBody });
      setIsEditing(false);
      toast.success("Innlegg oppdatert");
    } catch {
      toast.error("Noe gikk galt");
    }
  }

  async function confirmDelete() {
    try {
      await new Promise<void>((resolve, reject) => {
        deletePost(post.id, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
      });
      toast.success("Innlegg slettet");
    } catch {
      toast.error("Noe gikk galt");
      setShowDeleteConfirm(false);
    }
  }

  function handleKnowCar() {
    if (!canRequestRelationship) return;
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setShowRelationship(true);
  }

  return (
    <>
      <FeedPostCard
        post={post}
        theme={resolvedTheme}
        author={author}
        isOwn={isOwn}
        isEditing={isEditing}
        editBody={editBody}
        onEditBodyChange={setEditBody}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => { setIsEditing(false); setEditBody(post.body ?? ""); }}
        isEditPending={isEditPending}
        showMenu={showMenu}
        onToggleMenu={() => setShowMenu(!showMenu)}
        onStartEdit={() => { setIsEditing(true); setShowMenu(false); }}
        onDelete={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
        showDeleteConfirm={showDeleteConfirm}
        onConfirmDelete={confirmDelete}
        onCancelDelete={() => setShowDeleteConfirm(false)}
        showComments={showComments}
        onToggleComments={() => setShowComments(!showComments)}
        onImageClick={() => setLightboxOpen(true)}
        onShare={() => { void shareFeedPost(post); }}
        onKnowCar={canRequestRelationship ? handleKnowCar : undefined}
      >
        {showComments && <CommentSection feedPostId={post.id} />}
      </FeedPostCard>

      <ImageLightbox
        images={images}
        initialIndex={0}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {canRequestRelationship && car?.id && (
        <RelationshipRequestDialog
          open={showRelationship}
          onOpenChange={setShowRelationship}
          carId={car.id}
          carTitle="Ukjent bil"
          source="manual"
        />
      )}
    </>
  );
}
